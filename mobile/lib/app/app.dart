import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/auth_controller.dart';
import '../features/auth/splash_screen.dart';
import 'router.dart';

class AppRouterRoot extends ConsumerWidget {
  const AppRouterRoot({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(authControllerProvider);
    if (status == AuthStatus.unknown) {
      return MaterialApp(
        title: 'paham.in',
        home: const SplashScreen(),
        theme: _theme(),
      );
    }
    return MaterialApp.router(
      title: 'paham.in',
      theme: _theme(),
      routerConfig: ref.watch(routerProvider),
    );
  }
}

ThemeData _theme() => ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1E88E5)),
      useMaterial3: true,
    );