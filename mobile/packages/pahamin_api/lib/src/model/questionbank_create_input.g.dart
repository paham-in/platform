// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionbank_create_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionbankCreateInput _$QuestionbankCreateInputFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionbankCreateInput', json, ($checkedConvert) {
  final val = QuestionbankCreateInput(
    answers: $checkedConvert(
      'answers',
      (v) => (v as List<dynamic>?)
          ?.map(
            (e) =>
                QuestionbankQuizAnswerInput.fromJson(e as Map<String, dynamic>),
          )
          .toList(),
    ),
    explanation: $checkedConvert('explanation', (v) => v as String?),
    question: $checkedConvert('question', (v) => v as String?),
    userId: $checkedConvert('user_id', (v) => (v as num?)?.toInt()),
  );
  return val;
}, fieldKeyMap: const {'userId': 'user_id'});

Map<String, dynamic> _$QuestionbankCreateInputToJson(
  QuestionbankCreateInput instance,
) => <String, dynamic>{
  'answers': ?instance.answers?.map((e) => e.toJson()).toList(),
  'explanation': ?instance.explanation,
  'question': ?instance.question,
  'user_id': ?instance.userId,
};
