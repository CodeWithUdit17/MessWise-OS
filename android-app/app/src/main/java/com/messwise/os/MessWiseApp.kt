package com.messwise.os

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * MessWise OS Application class.
 * Annotated with @HiltAndroidApp to trigger Hilt code generation
 * and serve as the application-level dependency container.
 */
@HiltAndroidApp
class MessWiseApp : Application()
