// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionbank_quiz_answer_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionbankQuizAnswerInput _$QuestionbankQuizAnswerInputFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionbankQuizAnswerInput', json, ($checkedConvert) {
  final val = QuestionbankQuizAnswerInput(
    content: $checkedConvert('content', (v) => v as String?),
    isCorrect: $checkedConvert('is_correct', (v) => v as bool?),
  );
  return val;
}, fieldKeyMap: const {'isCorrect': 'is_correct'});

Map<String, dynamic> _$QuestionbankQuizAnswerInputToJson(
  QuestionbankQuizAnswerInput instance,
) => <String, dynamic>{
  'content': ?instance.content,
  'is_correct': ?instance.isCorrect,
};
