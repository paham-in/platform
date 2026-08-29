// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'forum_question_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ForumQuestionResponse _$ForumQuestionResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'ForumQuestionResponse',
  json,
  ($checkedConvert) {
    final val = ForumQuestionResponse(
      answerCount: $checkedConvert('answer_count', (v) => (v as num?)?.toInt()),
      content: $checkedConvert('content', (v) => v as String?),
      createdAt: $checkedConvert('created_at', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      isOwner: $checkedConvert('is_owner', (v) => v as bool?),
      plainContent: $checkedConvert('plain_content', (v) => v as String?),
      publicId: $checkedConvert('public_id', (v) => v as String?),
      status: $checkedConvert('status', (v) => v as String?),
      subjectId: $checkedConvert('subject_id', (v) => (v as num?)?.toInt()),
      subjectName: $checkedConvert('subject_name', (v) => v as String?),
      topAnswer: $checkedConvert(
        'top_answer',
        (v) => v == null
            ? null
            : ForumAnswerPreview.fromJson(v as Map<String, dynamic>),
      ),
      userAvatar: $checkedConvert('user_avatar', (v) => v as String?),
      userName: $checkedConvert('user_name', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'answerCount': 'answer_count',
    'createdAt': 'created_at',
    'isOwner': 'is_owner',
    'plainContent': 'plain_content',
    'publicId': 'public_id',
    'subjectId': 'subject_id',
    'subjectName': 'subject_name',
    'topAnswer': 'top_answer',
    'userAvatar': 'user_avatar',
    'userName': 'user_name',
  },
);

Map<String, dynamic> _$ForumQuestionResponseToJson(
  ForumQuestionResponse instance,
) => <String, dynamic>{
  'answer_count': ?instance.answerCount,
  'content': ?instance.content,
  'created_at': ?instance.createdAt,
  'id': ?instance.id,
  'is_owner': ?instance.isOwner,
  'plain_content': ?instance.plainContent,
  'public_id': ?instance.publicId,
  'status': ?instance.status,
  'subject_id': ?instance.subjectId,
  'subject_name': ?instance.subjectName,
  'top_answer': ?instance.topAnswer?.toJson(),
  'user_avatar': ?instance.userAvatar,
  'user_name': ?instance.userName,
};
