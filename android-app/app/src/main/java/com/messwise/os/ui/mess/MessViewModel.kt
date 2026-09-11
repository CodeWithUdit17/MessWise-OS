package com.messwise.os.ui.mess

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.messwise.os.data.model.*
import com.messwise.os.data.repository.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

data class MessUiState(
    val isLoading: Boolean = true,
    val user: User? = null,
    val menus: List<MessMenu> = emptyList(),
    val selectedMealType: MealType = MealType.LUNCH,
    val mealStatuses: Map<MealType, AttendanceStatus> = emptyMap(),
    val crowdMetrics: CrowdMetrics = CrowdMetrics(),
    val broadcasts: List<Broadcast> = emptyList(),
    val toastMessage: String? = null,
    val greenPoints: Int = 0
)

@HiltViewModel
class MessViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val menuRepository: MenuRepository,
    private val mealResponseRepository: MealResponseRepository,
    private val crowdRepository: CrowdRepository,
    private val broadcastRepository: BroadcastRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MessUiState())
    val uiState: StateFlow<MessUiState> = _uiState.asStateFlow()

    private val todayDate: String = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

    init {
        loadUserProfile()
        observeMenus()
        observeMealResponses()
        observeCrowdMetrics()
        observeBroadcasts()
    }

    private fun loadUserProfile() {
        viewModelScope.launch {
            authRepository.observeUserProfile().collect { user ->
                _uiState.update {
                    it.copy(user = user, greenPoints = user?.greenPoints ?: 0)
                }
            }
        }
    }

    private fun observeMenus() {
        viewModelScope.launch {
            menuRepository.observeMenusForDate(todayDate).collect { menus ->
                _uiState.update {
                    it.copy(menus = menus, isLoading = false)
                }
            }
        }
    }

    private fun observeMealResponses() {
        viewModelScope.launch {
            val vid = _uiState.value.user?.vid ?: return@launch

            mealResponseRepository.observeStudentResponses(vid, todayDate).collect { responses ->
                val statusMap = responses.associate { r ->
                    MealType.fromString(r.mealType) to r.status
                }
                _uiState.update { it.copy(mealStatuses = statusMap) }
            }
        }

        // Re-subscribe when user profile becomes available
        viewModelScope.launch {
            _uiState.map { it.user?.vid }.distinctUntilChanged().filterNotNull().collect { vid ->
                mealResponseRepository.observeStudentResponses(vid, todayDate).collect { responses ->
                    val statusMap = responses.associate { r ->
                        MealType.fromString(r.mealType) to r.status
                    }
                    _uiState.update { it.copy(mealStatuses = statusMap) }
                }
            }
        }
    }

    private fun observeCrowdMetrics() {
        viewModelScope.launch {
            crowdRepository.observeCrowdMetrics().collect { metrics ->
                _uiState.update { it.copy(crowdMetrics = metrics) }
            }
        }
    }

    private fun observeBroadcasts() {
        viewModelScope.launch {
            broadcastRepository.observeBroadcasts().collect { broadcasts ->
                _uiState.update { it.copy(broadcasts = broadcasts) }
            }
        }
    }

    fun selectMealType(mealType: MealType) {
        _uiState.update { it.copy(selectedMealType = mealType) }
    }

    /**
     * Toggle the student's meal attendance for the given meal type.
     * Enforces the 3-hour-prior cutoff rule.
     */
    fun toggleMealResponse(mealType: MealType) {
        val vid = _uiState.value.user?.vid ?: return
        val currentStatus = _uiState.value.mealStatuses[mealType] ?: AttendanceStatus.ATTENDING

        // 3-hour cutoff enforcement
        val now = java.time.LocalTime.now()
        val mealStartHour = when (mealType) {
            MealType.BREAKFAST -> 7
            MealType.LUNCH -> 12
            MealType.SNACKS -> 16
            MealType.DINNER -> 19
        }
        val cutoffTime = java.time.LocalTime.of(mealStartHour, 0).minusHours(3)

        if (now.isAfter(java.time.LocalTime.of(mealStartHour, 0).minusHours(3)) &&
            currentStatus == AttendanceStatus.ATTENDING
        ) {
            _uiState.update {
                it.copy(toastMessage = "⏰ Cutoff passed! Must opt out at least 3 hours before ${mealType.displayName}")
            }
            return
        }

        viewModelScope.launch {
            val result = mealResponseRepository.toggleMealResponse(
                vid = vid,
                date = todayDate,
                mealType = mealType,
                currentStatus = currentStatus
            )

            result.fold(
                onSuccess = { newStatus ->
                    val message = when (newStatus) {
                        AttendanceStatus.SKIPPED -> "🌿 Skipping ${mealType.displayName} — +15 Green Points earned!"
                        AttendanceStatus.ATTENDING -> "🍽️ You're eating ${mealType.displayName} today."
                    }
                    _uiState.update { it.copy(toastMessage = message) }

                    // Update green points locally if skipping
                    if (newStatus == AttendanceStatus.SKIPPED) {
                        _uiState.update {
                            it.copy(greenPoints = it.greenPoints + 15)
                        }
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(toastMessage = "❌ Failed: ${error.message}")
                    }
                }
            )
        }
    }

    fun clearToast() {
        _uiState.update { it.copy(toastMessage = null) }
    }
}
