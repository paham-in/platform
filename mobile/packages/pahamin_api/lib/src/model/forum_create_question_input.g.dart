// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'forum_create_question_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ForumCreateQuestionInput _$ForumCreateQuestionInputFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('ForumCreateQuestionInput', json, ($checkedConvert) {
  final val = ForumCreateQuestionInput(
    content: $checkedConvert('content', (v) => v as String?),
    subjectId: $checkedConvert('subject_id', (v) => (v as num?)?.toInt()),
  );
  return val;
}, fieldKeyMap: const {'subjectId': 'subject_id'});

Map<String, dynamic> _$ForumCreateQuestionInputToJson(
  ForumCreateQuestionInput instance,
) => <String, dynamic>{
  'content': ?instance.content,
  'subject_id': ?instance.subjectId,
};
