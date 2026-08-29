// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_submit_answer_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageSubmitAnswerResponse
_$QuestionpackageSubmitAnswerResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate(
      'QuestionpackageSubmitAnswerResponse',
      json,
      ($checkedConvert) {
        final val = QuestionpackageSubmitAnswerResponse(
          correctAnswerIds: $checkedConvert(
            'correct_answer_ids',
            (v) =>
                (v as List<dynamic>?)?.map((e) => (e as num).toInt()).toList(),
          ),
          explanation: $checkedConvert('explanation', (v) => v as String?),
          isCorrect: $checkedConvert('is_correct', (v) => v as bool?),
        );
        return val;
      },
      fieldKeyMap: const {
        'correctAnswerIds': 'correct_answer_ids',
        'isCorrect': 'is_correct',
      },
    );

Map<String, dynamic> _$QuestionpackageSubmitAnswerResponseToJson(
  QuestionpackageSubmitAnswerResponse instance,
) => <String, dynamic>{
  'correct_answer_ids': ?instance.correctAnswerIds,
  'explanation': ?instance.explanation,
  'is_correct': ?instance.isCorrect,
};
