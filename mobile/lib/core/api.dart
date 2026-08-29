import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../features/auth/auth_controller.dart';
import 'config.dart';
import 'token_store.dart';

final apiProvider = Provider<PahaminApi>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));
  dio.interceptors.add(AuthInterceptor(() => ref.read(sessionTokenProvider), ref));
  return PahaminApi(dio: dio, interceptors: []);
});

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._tokenOf, this._ref);

  final String? Function() _tokenOf;
  final Ref _ref;
  bool _handling401 = false;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _tokenOf();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401 && !_handling401) {
      _handling401 = true;
      _ref.read(authControllerProvider.notifier).forceLogout();
    }
    handler.next(err);
  }
}

/// Throws a human-readable [ApiException] for any non-2xx response.
Future<T> unwrap<T>(Future<Response<T>> request) async {
  try {
    final res = await request;
    return res.data as T;
  } on DioException catch (e) {
    throw ApiException(_message(e));
  }
}

class ApiException implements Exception {
  ApiException(this.message);
  final String message;

  @override
  String toString() => message;
}

String _message(DioException e) {
  final data = e.response?.data;
  if (data is Map) {
    final msg = data['error'] ?? data['message'];
    if (msg is String && msg.isNotEmpty) return msg;
  }
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return 'Koneksi timeout. Periksa server.';
    case DioExceptionType.connectionError:
      return 'Tidak dapat terhubung ke server';
    case DioExceptionType.badCertificate:
      return 'Sertifikat tidak valid';
    case DioExceptionType.unknown:
      return 'Terjadi kesalahan: ${e.error ?? e.message}';
    default:
      return e.message ?? 'Terjadi kesalahan';
  }
}