import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/admin/admin_classes_screen.dart';
import '../features/admin/admin_home_screen.dart';
import '../features/admin/admin_materials_screen.dart';
import '../features/admin/admin_subjects_screen.dart';
import '../features/admin/admin_users_screen.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/login_screen.dart';
import '../features/belajar/belajar_screen.dart';
import '../features/belajar/chapters_screen.dart';
import '../features/belajar/material_detail_screen.dart';
import '../features/belajar/materials_screen.dart';
import '../features/belajar/subjects_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/forum/ask_question_screen.dart';
import '../features/forum/forum_list_screen.dart';
import '../features/forum/question_detail_screen.dart';
import '../features/invoice/invoices_screen.dart';
import '../features/invoice/subscribe_screen.dart';
import '../features/notification/notification_screen.dart';
import '../features/paketsoal/package_collections_screen.dart';
import '../features/paketsoal/package_work_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/tutor/booking_form_screen.dart';
import '../features/tutor/bookings_screen.dart';
import '../features/tutor/earnings_screen.dart';
import '../features/tutor/sessions_screen.dart';
import 'shell_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier(0);
  ref.listen(authControllerProvider, (prev, next) {
    if (prev != next) refresh.value++;
    if (next == AuthStatus.anon) refresh.value++;
  });

  return GoRouter(
    initialLocation: '/beranda',
    refreshListenable: refresh,
    redirect: (context, state) {
      final status = ref.read(authControllerProvider);
      final atLogin = state.matchedLocation == '/login';
      if (status == AuthStatus.anon && !atLogin) return '/login';
      if (status == AuthStatus.authed && atLogin) return '/beranda';
      if (status == AuthStatus.authed &&
          state.matchedLocation.startsWith('/admin') &&
          !(ref.read(authControllerProvider.notifier).isAdmin)) {
        return '/beranda';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            ShellScreen(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [GoRoute(path: '/beranda', builder: (context, state) => const DashboardScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/belajar', builder: (context, state) => const BelajarScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/forum', builder: (context, state) => const ForumListScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/notifikasi', builder: (context, state) => const NotificationScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/profil', builder: (context, state) => const ProfileScreen())],
          ),
        ],
      ),
      GoRoute(
        path: '/kelas/:classId/mapel',
        builder: (context, state) => SubjectsScreen(classId: int.parse(state.pathParameters['classId']!)),
      ),
      GoRoute(
        path: '/kelas/:classId/:subjectId/bab',
        builder: (context, state) => ChaptersScreen(
          classId: int.parse(state.pathParameters['classId']!),
          subjectId: int.parse(state.pathParameters['subjectId']!),
        ),
      ),
      GoRoute(
        path: '/kelas/:classId/:subjectId/:chapterId/materi',
        builder: (context, state) => MaterialsScreen(chapterId: int.parse(state.pathParameters['chapterId']!)),
      ),
      GoRoute(
        path: '/materi/:id',
        builder: (context, state) => MaterialDetailScreen(id: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(path: '/forum/tanya', builder: (context, state) => const AskQuestionScreen()),
      GoRoute(
        path: '/forum/:id',
        builder: (context, state) => QuestionDetailScreen(id: int.parse(state.pathParameters['id']!)),
      ),
      GoRoute(path: '/paket', builder: (context, state) => const PackageCollectionsScreen()),
      GoRoute(
        path: '/paket/:publicId',
        builder: (context, state) => PackagesInCollectionScreen(publicId: state.pathParameters['publicId']!),
      ),
      GoRoute(
        path: '/paket/kerja/:publicId',
        builder: (context, state) => PackageWorkScreen(publicId: state.pathParameters['publicId']!),
      ),
      GoRoute(path: '/tutor', builder: (context, state) => const BookingsScreen()),
      GoRoute(path: '/tutor/baru', builder: (context, state) => const BookingFormScreen()),
      GoRoute(path: '/tutor/sesi', builder: (context, state) => const SessionsScreen()),
      GoRoute(path: '/tutor/pendapatan', builder: (context, state) => const EarningsScreen()),
      GoRoute(path: '/invoice', builder: (context, state) => const InvoicesScreen()),
      GoRoute(path: '/invoice/berlangganan', builder: (context, state) => const SubscribeScreen()),
      GoRoute(path: '/admin', builder: (context, state) => const AdminHomeScreen()),
      GoRoute(path: '/admin/users', builder: (context, state) => const AdminUsersScreen()),
      GoRoute(path: '/admin/kelas', builder: (context, state) => const AdminClassesScreen()),
      GoRoute(path: '/admin/mapel', builder: (context, state) => const AdminSubjectsScreen()),
      GoRoute(path: '/admin/materi', builder: (context, state) => const AdminMaterialsScreen()),
    ],
  );
});