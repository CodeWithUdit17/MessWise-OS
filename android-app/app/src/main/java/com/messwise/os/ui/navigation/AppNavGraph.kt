package com.messwise.os.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.messwise.os.ui.auth.AuthViewModel
import com.messwise.os.ui.auth.LoginScreen
import com.messwise.os.ui.mess.StudentMessScreen
import com.messwise.os.ui.tickets.TicketScreen

/**
 * App-level navigation graph with 3 destinations:
 * - Login → StudentMess → Tickets
 *
 * Auth state determines initial route.
 */
@Composable
fun AppNavGraph() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val authState by authViewModel.uiState.collectAsStateWithLifecycle()

    val startDestination = if (authState.isLoggedIn) "mess" else "login"

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable("login") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate("mess") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }

        composable("mess") {
            StudentMessScreen(
                onNavigateToTickets = {
                    navController.navigate("tickets")
                },
                onLogout = {
                    authViewModel.logout()
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable("tickets") {
            TicketScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
