// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageErrorResponse _$QuestionpackageErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionpackageErrorResponse', json, ($checkedConvert) {
  final val = QuestionpackageErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$QuestionpackageErrorResponseToJson(
  QuestionpackageErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
