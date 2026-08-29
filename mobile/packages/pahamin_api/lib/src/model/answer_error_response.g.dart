// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'answer_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AnswerErrorResponse _$AnswerErrorResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('AnswerErrorResponse', json, ($checkedConvert) {
      final val = AnswerErrorResponse(
        error: $checkedConvert('error', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$AnswerErrorResponseToJson(
  AnswerErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
