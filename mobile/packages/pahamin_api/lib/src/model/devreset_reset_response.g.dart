// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'devreset_reset_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DevresetResetResponse _$DevresetResetResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('DevresetResetResponse', json, ($checkedConvert) {
  final val = DevresetResetResponse(
    deleted: $checkedConvert('deleted', (v) => (v as num?)?.toInt()),
    message: $checkedConvert('message', (v) => v as String?),
    table: $checkedConvert('table', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$DevresetResetResponseToJson(
  DevresetResetResponse instance,
) => <String, dynamic>{
  'deleted': ?instance.deleted,
  'message': ?instance.message,
  'table': ?instance.table,
};
