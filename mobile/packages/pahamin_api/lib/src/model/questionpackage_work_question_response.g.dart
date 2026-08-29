// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_work_question_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageWorkQuestionResponse
_$QuestionpackageWorkQuestionResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('QuestionpackageWorkQuestionResponse', json, (
      $checkedConvert,
    ) {
      final val = QuestionpackageWorkQuestionResponse(
        answers: $checkedConvert(
          'answers',
          (v) => (v as List<dynamic>?)
              ?.map(
                (e) => QuestionpackageWorkAnswerResponse.fromJson(
                  e as Map<String, dynamic>,
                ),
              )
              .toList(),
        ),
        id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
        question: $checkedConvert('question', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$QuestionpackageWorkQuestionResponseToJson(
  QuestionpackageWorkQuestionResponse instance,
) => <String, dynamic>{
  'answers': ?instance.answers?.map((e) => e.toJson()).toList(),
  'id': ?instance.id,
  'question': ?instance.question,
};
