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
import com.messwise.os.ui.auth.ResetPasswordScreen
import com.messwise.os.ui.health.SickMealScreen
import com.messwise.os.ui.holiday.HolidayRebateScreen
import com.messwise.os.ui.mess.MessViewModel
import com.messwise.os.ui.mess.StudentMessScreen
import com.messwise.os.ui.scanner.MessEntryQrScreen
import com.messwise.os.ui.scanner.PlateScannerScreen
import com.messwise.os.ui.special.SpecialLunchScreen
import com.messwise.os.ui.techsupport.TechnicalComplaintScreen
import com.messwise.os.ui.tickets.TicketScreen

/**
 * App-level navigation graph for MessWise OS with 10 features:
 * - login / reset-password
 * - mess
 * - plate-scanner
 * - qr-entry
 * - sick-meal
 * - special-lunch
 * - holiday-rebate
 * - tech-complaint
 * - tickets
 */
@Composable
fun AppNavGraph() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val messViewModel: MessViewModel = hiltViewModel()
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
                },
                onNavigateToResetPassword = {
                    navController.navigate("reset-password")
                },
                viewModel = authViewModel
            )
        }

        composable("reset-password") {
            ResetPasswordScreen(
                onNavigateBack = { navController.popBackStack() },
                advancedRepo = messViewModel.advancedRepository
            )
        }

        composable("mess") {
            StudentMessScreen(
                onNavigateToTickets = { navController.navigate("tickets") },
                onNavigateToPlateScanner = { navController.navigate("plate-scanner") },
                onNavigateToEntryQr = { navController.navigate("qr-entry") },
                onNavigateToSickMeal = { navController.navigate("sick-meal") },
                onNavigateToSpecialLunch = { navController.navigate("special-lunch") },
                onNavigateToHolidayRebate = { navController.navigate("holiday-rebate") },
                onNavigateToTechnicalComplaint = { navController.navigate("tech-complaint") },
                onLogout = {
                    authViewModel.logout()
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                },
                viewModel = messViewModel
            )
        }

        composable("plate-scanner") {
            PlateScannerScreen(
                onNavigateBack = { navController.popBackStack() },
                advancedRepo = messViewModel.advancedRepository,
                authRepo = authViewModel.authRepository
            )
        }

        composable("qr-entry") {
            MessEntryQrScreen(
                onNavigateBack = { navController.popBackStack() },
                advancedRepo = messViewModel.advancedRepository,
                authRepo = authViewModel.authRepository
            )
        }

        composable("sick-meal") {
            SickMealScreen(
                onNavigateBack = { navController.popBackStack() },
                advancedRepo = messViewModel.advancedRepository,
                authRepo = authViewModel.authRepository
            )
        }

        composable("special-lunch") {
            SpecialLunchScreen(
                onNavigateBack = { navController.popBackStack() },
                advancedRepo = messViewModel.advancedRepository,
                authRepo = authViewModel.authRepository
            )
        }

        composable("holiday-rebate") {
            HolidayRebateScreen(
                onNavigateBack = { navController.popBackStack() },
                advancedRepo = messViewModel.advancedRepository,
                authRepo = authViewModel.authRepository
            )
        }

        composable("tech-complaint") {
            TechnicalComplaintScreen(
                onNavigateBack = { navController.popBackStack() },
                advancedRepo = messViewModel.advancedRepository,
                authRepo = authViewModel.authRepository
            )
        }

        composable("tickets") {
            TicketScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
