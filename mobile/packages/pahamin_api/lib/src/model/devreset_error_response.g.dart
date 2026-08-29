// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'devreset_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DevresetErrorResponse _$DevresetErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('DevresetErrorResponse', json, ($checkedConvert) {
  final val = DevresetErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$DevresetErrorResponseToJson(
  DevresetErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
