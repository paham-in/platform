// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionbank_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionbankErrorResponse _$QuestionbankErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionbankErrorResponse', json, ($checkedConvert) {
  final val = QuestionbankErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$QuestionbankErrorResponseToJson(
  QuestionbankErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
