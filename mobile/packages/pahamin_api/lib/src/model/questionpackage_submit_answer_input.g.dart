// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_submit_answer_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageSubmitAnswerInput _$QuestionpackageSubmitAnswerInputFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionpackageSubmitAnswerInput', json, (
  $checkedConvert,
) {
  final val = QuestionpackageSubmitAnswerInput(
    answerId: $checkedConvert('answer_id', (v) => (v as num?)?.toInt()),
    questionId: $checkedConvert('question_id', (v) => (v as num?)?.toInt()),
  );
  return val;
}, fieldKeyMap: const {'answerId': 'answer_id', 'questionId': 'question_id'});

Map<String, dynamic> _$QuestionpackageSubmitAnswerInputToJson(
  QuestionpackageSubmitAnswerInput instance,
) => <String, dynamic>{
  'answer_id': ?instance.answerId,
  'question_id': ?instance.questionId,
};
