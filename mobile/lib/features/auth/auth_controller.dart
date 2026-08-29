import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../core/config.dart';
import '../../core/token_store.dart';

enum AuthStatus { unknown, authed, anon }

final authControllerProvider =
    NotifierProvider<AuthController, AuthStatus>(AuthController.new);

class AuthController extends Notifier<AuthStatus> {
  UserMeResponse? _user;
  UserMeResponse? get user => _user;
  bool get isAdmin => _user?.roles?.contains('admin') ?? false;
  bool get isTeacher => _user?.roles?.contains('teacher') ?? false;

  @override
  AuthStatus build() {
    _bootstrap();
    return AuthStatus.unknown;
  }

  Future<void> _bootstrap() async {
    final stored = await ref.read(tokenStoreProvider).read();
    if (stored == null || stored.isEmpty) {
      state = AuthStatus.anon;
      return;
    }
    ref.read(sessionTokenProvider.notifier).set(stored);
    try {
      _user = await unwrap(ref.read(apiProvider).getAuthApi().meGet());
      state = AuthStatus.authed;
    } catch (_) {
      await ref.read(tokenStoreProvider).clear();
      ref.read(sessionTokenProvider.notifier).set(null);
      state = AuthStatus.anon;
    }
  }

  Future<void> loginWithGoogle() async {
    final authUrl = Uri.parse('${AppConfig.baseUrl}/auth/google')
        .replace(queryParameters: {
          'redirect': '${AppConfig.oauthCallbackScheme}://',
        })
        .toString();
    final result = await FlutterWebAuth2.authenticate(
      url: authUrl,
      callbackUrlScheme: AppConfig.oauthCallbackScheme,
    );
    final token = Uri.parse(result).queryParameters['token'];
    if (token == null || token.isEmpty) {
      throw ApiException('Login gagal: tidak ada token pada callback.');
    }
    await ref.read(tokenStoreProvider).write(token);
    ref.read(sessionTokenProvider.notifier).set(token);
    _user = await unwrap(ref.read(apiProvider).getAuthApi().meGet());
    state = AuthStatus.authed;
  }

  Future<void> logout() async {
    try {
      await unwrap(ref.read(apiProvider).getAuthApi().logoutPost());
    } catch (_) {}
    await forceLogout();
  }

  Future<void> forceLogout() async {
    await ref.read(tokenStoreProvider).clear();
    ref.read(sessionTokenProvider.notifier).set(null);
    _user = null;
    state = AuthStatus.anon;
  }
}