// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upload_temp_upload_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UploadTempUploadResponse _$UploadTempUploadResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UploadTempUploadResponse', json, ($checkedConvert) {
  final val = UploadTempUploadResponse(
    objectName: $checkedConvert('object_name', (v) => v as String?),
    url: $checkedConvert('url', (v) => v as String?),
  );
  return val;
}, fieldKeyMap: const {'objectName': 'object_name'});

Map<String, dynamic> _$UploadTempUploadResponseToJson(
  UploadTempUploadResponse instance,
) => <String, dynamic>{
  'object_name': ?instance.objectName,
  'url': ?instance.url,
};
