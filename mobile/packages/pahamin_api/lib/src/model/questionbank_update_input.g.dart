// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionbank_update_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionbankUpdateInput _$QuestionbankUpdateInputFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionbankUpdateInput', json, ($checkedConvert) {
  final val = QuestionbankUpdateInput(
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
  );
  return val;
});

Map<String, dynamic> _$QuestionbankUpdateInputToJson(
  QuestionbankUpdateInput instance,
) => <String, dynamic>{
  'answers': ?instance.answers?.map((e) => e.toJson()).toList(),
  'explanation': ?instance.explanation,
  'question': ?instance.question,
};
