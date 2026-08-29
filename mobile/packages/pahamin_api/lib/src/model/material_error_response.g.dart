// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'material_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaterialErrorResponse _$MaterialErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('MaterialErrorResponse', json, ($checkedConvert) {
  final val = MaterialErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$MaterialErrorResponseToJson(
  MaterialErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
