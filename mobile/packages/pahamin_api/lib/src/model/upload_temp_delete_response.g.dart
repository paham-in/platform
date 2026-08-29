// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upload_temp_delete_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UploadTempDeleteResponse _$UploadTempDeleteResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('UploadTempDeleteResponse', json, ($checkedConvert) {
  final val = UploadTempDeleteResponse(
    ok: $checkedConvert('ok', (v) => v as bool?),
  );
  return val;
});

Map<String, dynamic> _$UploadTempDeleteResponseToJson(
  UploadTempDeleteResponse instance,
) => <String, dynamic>{'ok': ?instance.ok};
