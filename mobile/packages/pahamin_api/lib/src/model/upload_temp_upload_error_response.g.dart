// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upload_temp_upload_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UploadTempUploadErrorResponse _$UploadTempUploadErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UploadTempUploadErrorResponse', json, ($checkedConvert) {
  final val = UploadTempUploadErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$UploadTempUploadErrorResponseToJson(
  UploadTempUploadErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
