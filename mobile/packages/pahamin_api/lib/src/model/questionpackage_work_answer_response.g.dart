// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_work_answer_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageWorkAnswerResponse _$QuestionpackageWorkAnswerResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionpackageWorkAnswerResponse', json, (
  $checkedConvert,
) {
  final val = QuestionpackageWorkAnswerResponse(
    content: $checkedConvert('content', (v) => v as String?),
    id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
  );
  return val;
});

Map<String, dynamic> _$QuestionpackageWorkAnswerResponseToJson(
  QuestionpackageWorkAnswerResponse instance,
) => <String, dynamic>{'content': ?instance.content, 'id': ?instance.id};
