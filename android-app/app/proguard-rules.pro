# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepattributes Signature

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Firestore model classes
-keep class com.messwise.os.data.model.** { *; }

# Hilt
-dontwarn dagger.hilt.**
