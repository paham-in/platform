// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_work_progress_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageWorkProgressResponse
_$QuestionpackageWorkProgressResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'QuestionpackageWorkProgressResponse',
  json,
  ($checkedConvert) {
    final val = QuestionpackageWorkProgressResponse(
      completedCount: $checkedConvert(
        'completed_count',
        (v) => (v as num?)?.toInt(),
      ),
      completedIds: $checkedConvert(
        'completed_ids',
        (v) => (v as List<dynamic>?)?.map((e) => (e as num).toInt()).toList(),
      ),
      correctAnswerIds: $checkedConvert(
        'correct_answer_ids',
        (v) => (v as Map<String, dynamic>?)?.map(
          (k, e) => MapEntry(
            k,
            (e as List<dynamic>).map((e) => (e as num).toInt()).toList(),
          ),
        ),
      ),
      explanations: $checkedConvert(
        'explanations',
        (v) => (v as Map<String, dynamic>?)?.map(
          (k, e) => MapEntry(k, e as String),
        ),
      ),
      isCorrect: $checkedConvert(
        'is_correct',
        (v) =>
            (v as Map<String, dynamic>?)?.map((k, e) => MapEntry(k, e as bool)),
      ),
      selectedAnswers: $checkedConvert(
        'selected_answers',
        (v) => (v as Map<String, dynamic>?)?.map(
          (k, e) => MapEntry(k, (e as num).toInt()),
        ),
      ),
      totalCount: $checkedConvert('total_count', (v) => (v as num?)?.toInt()),
    );
    return val;
  },
  fieldKeyMap: const {
    'completedCount': 'completed_count',
    'completedIds': 'completed_ids',
    'correctAnswerIds': 'correct_answer_ids',
    'isCorrect': 'is_correct',
    'selectedAnswers': 'selected_answers',
    'totalCount': 'total_count',
  },
);

Map<String, dynamic> _$QuestionpackageWorkProgressResponseToJson(
  QuestionpackageWorkProgressResponse instance,
) => <String, dynamic>{
  'completed_count': ?instance.completedCount,
  'completed_ids': ?instance.completedIds,
  'correct_answer_ids': ?instance.correctAnswerIds,
  'explanations': ?instance.explanations,
  'is_correct': ?instance.isCorrect,
  'selected_answers': ?instance.selectedAnswers,
  'total_count': ?instance.totalCount,
};
