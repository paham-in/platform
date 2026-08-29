// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionbank_question_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionbankQuestionResponse _$QuestionbankQuestionResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'QuestionbankQuestionResponse',
  json,
  ($checkedConvert) {
    final val = QuestionbankQuestionResponse(
      answers: $checkedConvert(
        'answers',
        (v) => (v as List<dynamic>?)
            ?.map(
              (e) => QuestionbankAnswerResponse.fromJson(
                e as Map<String, dynamic>,
              ),
            )
            .toList(),
      ),
      createdAt: $checkedConvert('created_at', (v) => v as String?),
      explanation: $checkedConvert('explanation', (v) => v as String?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      packageId: $checkedConvert('package_id', (v) => (v as num?)?.toInt()),
      question: $checkedConvert('question', (v) => v as String?),
      userId: $checkedConvert('user_id', (v) => (v as num?)?.toInt()),
      userName: $checkedConvert('user_name', (v) => v as String?),
    );
    return val;
  },
  fieldKeyMap: const {
    'createdAt': 'created_at',
    'packageId': 'package_id',
    'userId': 'user_id',
    'userName': 'user_name',
  },
);

Map<String, dynamic> _$QuestionbankQuestionResponseToJson(
  QuestionbankQuestionResponse instance,
) => <String, dynamic>{
  'answers': ?instance.answers?.map((e) => e.toJson()).toList(),
  'created_at': ?instance.createdAt,
  'explanation': ?instance.explanation,
  'id': ?instance.id,
  'package_id': ?instance.packageId,
  'question': ?instance.question,
  'user_id': ?instance.userId,
  'user_name': ?instance.userName,
};
