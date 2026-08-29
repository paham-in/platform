// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studentclass_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StudentclassErrorResponse _$StudentclassErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('StudentclassErrorResponse', json, ($checkedConvert) {
  final val = StudentclassErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$StudentclassErrorResponseToJson(
  StudentclassErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
