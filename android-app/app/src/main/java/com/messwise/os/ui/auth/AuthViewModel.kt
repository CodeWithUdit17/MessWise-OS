package com.messwise.os.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.messwise.os.data.model.User
import com.messwise.os.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val user: User? = null,
    val error: String? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        // Check if already authenticated
        if (authRepository.isLoggedIn) {
            viewModelScope.launch {
                val uid = authRepository.currentUid ?: return@launch
                val user = authRepository.fetchUserProfile(uid)
                _uiState.update {
                    it.copy(isLoggedIn = true, user = user)
                }
            }
        }
    }

    fun login(vid: String, password: String) {
        if (vid.isBlank() || password.isBlank()) {
            _uiState.update { it.copy(error = "Please enter both VID and password") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val result = authRepository.loginWithVid(vid, password)
            result.fold(
                onSuccess = { user ->
                    _uiState.update {
                        it.copy(isLoading = false, isLoggedIn = true, user = user, error = null)
                    }
                },
                onFailure = { exception ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Login failed"
                        )
                    }
                }
            )
        }
    }

    fun logout() {
        authRepository.logout()
        _uiState.update { AuthUiState() }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
