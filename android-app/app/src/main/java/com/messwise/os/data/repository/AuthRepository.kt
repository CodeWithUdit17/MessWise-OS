package com.messwise.os.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.messwise.os.data.model.User
import com.messwise.os.data.model.UserRole
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Handles Firebase Authentication and user profile management.
 *
 * Authentication flow:
 * 1. Student enters VID + password
 * 2. VID is mapped to email via Firestore lookup (vid → email)
 * 3. Firebase Auth signInWithEmailAndPassword is called
 * 4. User profile is fetched from `users/{uid}`
 */
@Singleton
class AuthRepository @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) {
    /** Currently authenticated Firebase UID, or null. */
    val currentUid: String? get() = auth.currentUser?.uid

    /** Whether a user is currently signed in. */
    val isLoggedIn: Boolean get() = auth.currentUser != null

    /**
     * Sign in using Student VID and password.
     * Looks up the VID in Firestore to find the associated email,
     * then authenticates with Firebase Auth.
     */
    suspend fun loginWithVid(vid: String, password: String): Result<User> {
        return try {
            // Step 1: Look up VID → email from Firestore users collection
            val querySnapshot = firestore.collection("users")
                .whereEqualTo("vid", vid.uppercase().trim())
                .limit(1)
                .get()
                .await()

            if (querySnapshot.isEmpty) {
                return Result.failure(Exception("No account found for VID: $vid"))
            }

            val userDoc = querySnapshot.documents.first()
            val email = userDoc.getString("email")
                ?: return Result.failure(Exception("Account has no email configured"))

            // Step 2: Authenticate with Firebase Auth
            auth.signInWithEmailAndPassword(email, password).await()

            // Step 3: Fetch full user profile
            val uid = auth.currentUser?.uid
                ?: return Result.failure(Exception("Authentication failed"))

            val profile = fetchUserProfile(uid)
                ?: return Result.failure(Exception("User profile not found"))

            Result.success(profile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Fetch user profile from Firestore `users/{uid}`.
     */
    suspend fun fetchUserProfile(uid: String): User? {
        return try {
            val doc = firestore.collection("users").document(uid).get().await()
            if (doc.exists()) {
                User(
                    uid = uid,
                    vid = doc.getString("vid") ?: "",
                    name = doc.getString("name") ?: "",
                    email = doc.getString("email") ?: "",
                    role = try {
                        UserRole.valueOf(doc.getString("role") ?: "STUDENT")
                    } catch (_: Exception) {
                        UserRole.STUDENT
                    },
                    hostelBlock = doc.getString("hostelBlock") ?: "",
                    roomNo = doc.getString("roomNo") ?: "",
                    greenPoints = doc.getLong("greenPoints")?.toInt() ?: 0
                )
            } else null
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Observe the current user's profile in real-time.
     * Emits null if not logged in.
     */
    fun observeUserProfile(): Flow<User?> = callbackFlow {
        val uid = currentUid
        if (uid == null) {
            trySend(null)
            close()
            return@callbackFlow
        }

        val listener = firestore.collection("users").document(uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(null)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    val user = User(
                        uid = uid,
                        vid = snapshot.getString("vid") ?: "",
                        name = snapshot.getString("name") ?: "",
                        email = snapshot.getString("email") ?: "",
                        role = try {
                            UserRole.valueOf(snapshot.getString("role") ?: "STUDENT")
                        } catch (_: Exception) {
                            UserRole.STUDENT
                        },
                        hostelBlock = snapshot.getString("hostelBlock") ?: "",
                        roomNo = snapshot.getString("roomNo") ?: "",
                        greenPoints = snapshot.getLong("greenPoints")?.toInt() ?: 0
                    )
                    trySend(user)
                } else {
                    trySend(null)
                }
            }

        awaitClose { listener.remove() }
    }

    /** Sign out the current user. */
    fun logout() {
        auth.signOut()
    }
}
