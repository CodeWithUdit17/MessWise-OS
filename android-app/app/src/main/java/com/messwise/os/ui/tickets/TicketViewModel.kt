package com.messwise.os.ui.tickets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.messwise.os.data.model.*
import com.messwise.os.data.repository.AuthRepository
import com.messwise.os.data.repository.TicketRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TicketUiState(
    val isLoading: Boolean = true,
    val tickets: List<MaintenanceTicket> = emptyList(),
    val selectedCategory: TicketCategory = TicketCategory.PLUMBING,
    val description: String = "",
    val isSubmitting: Boolean = false,
    val toastMessage: String? = null,
    val user: User? = null
)

@HiltViewModel
class TicketViewModel @Inject constructor(
    private val ticketRepository: TicketRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TicketUiState())
    val uiState: StateFlow<TicketUiState> = _uiState.asStateFlow()

    init {
        loadUser()
    }

    private fun loadUser() {
        viewModelScope.launch {
            authRepository.observeUserProfile().collect { user ->
                _uiState.update { it.copy(user = user) }

                if (user != null) {
                    observeTickets(user.vid)
                }
            }
        }
    }

    private fun observeTickets(vid: String) {
        viewModelScope.launch {
            ticketRepository.observeStudentTickets(vid).collect { tickets ->
                _uiState.update { it.copy(tickets = tickets, isLoading = false) }
            }
        }
    }

    fun updateCategory(category: TicketCategory) {
        _uiState.update { it.copy(selectedCategory = category) }
    }

    fun updateDescription(desc: String) {
        _uiState.update { it.copy(description = desc) }
    }

    fun submitTicket() {
        val user = _uiState.value.user ?: return
        val desc = _uiState.value.description.trim()

        if (desc.isBlank()) {
            _uiState.update { it.copy(toastMessage = "Please describe the issue") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }

            val result = ticketRepository.createTicket(
                vid = user.vid,
                hostelBlock = user.hostelBlock,
                roomNo = user.roomNo,
                category = _uiState.value.selectedCategory,
                description = desc
            )

            result.fold(
                onSuccess = { ticketId ->
                    _uiState.update {
                        it.copy(
                            isSubmitting = false,
                            description = "",
                            toastMessage = "✅ Ticket #${ticketId.take(8)} submitted!"
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isSubmitting = false,
                            toastMessage = "❌ Failed: ${error.message}"
                        )
                    }
                }
            )
        }
    }

    fun clearToast() {
        _uiState.update { it.copy(toastMessage = null) }
    }
}
