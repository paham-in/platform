// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'setting_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SettingErrorResponse _$SettingErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('SettingErrorResponse', json, ($checkedConvert) {
  final val = SettingErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$SettingErrorResponseToJson(
  SettingErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
