// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upload_temp_delete_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UploadTempDeleteRequest _$UploadTempDeleteRequestFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UploadTempDeleteRequest', json, ($checkedConvert) {
  final val = UploadTempDeleteRequest(
    url: $checkedConvert('url', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$UploadTempDeleteRequestToJson(
  UploadTempDeleteRequest instance,
) => <String, dynamic>{'url': ?instance.url};
