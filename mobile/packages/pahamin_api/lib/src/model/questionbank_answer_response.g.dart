// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionbank_answer_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionbankAnswerResponse _$QuestionbankAnswerResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionbankAnswerResponse', json, ($checkedConvert) {
  final val = QuestionbankAnswerResponse(
    content: $checkedConvert('content', (v) => v as String?),
    id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
    isCorrect: $checkedConvert('is_correct', (v) => v as bool?),
  );
  return val;
}, fieldKeyMap: const {'isCorrect': 'is_correct'});

Map<String, dynamic> _$QuestionbankAnswerResponseToJson(
  QuestionbankAnswerResponse instance,
) => <String, dynamic>{
  'content': ?instance.content,
  'id': ?instance.id,
  'is_correct': ?instance.isCorrect,
};
