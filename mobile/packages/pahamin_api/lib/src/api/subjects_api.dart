//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'dart:async';

// ignore: unused_import
import 'dart:convert';
import 'package:pahamin_api/src/deserialize.dart';
import 'package:dio/dio.dart';

import 'package:pahamin_api/src/model/subject_list_subjects_response.dart';

class SubjectsApi {

  final Dio _dio;

  const SubjectsApi(this._dio);

  /// List subjects
  /// Mengembalikan daftar semua mata pelajaran, bisa difilter search &amp; class_id
  ///
  /// Parameters:
  /// * [search] - Search by name
  /// * [classId] - Filter by class ID
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [List<SubjectListSubjectsResponse>] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<List<SubjectListSubjectsResponse>>> subjectsGet({ 
    String? search,
    int? classId,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/subjects';
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _queryParameters = <String, dynamic>{
      if (search != null) r'search': search,
      if (classId != null) r'class_id': classId,
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    List<SubjectListSubjectsResponse>? _responseData;

    try {
final rawData = _response.data;
_responseData = rawData == null ? null : deserialize<List<SubjectListSubjectsResponse>, SubjectListSubjectsResponse>(rawData, 'List<SubjectListSubjectsResponse>', growable: true);

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<List<SubjectListSubjectsResponse>>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }

}
