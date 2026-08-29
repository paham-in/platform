// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_package_question_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackagePackageQuestionResponse
_$QuestionpackagePackageQuestionResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('QuestionpackagePackageQuestionResponse', json, (
      $checkedConvert,
    ) {
      final val = QuestionpackagePackageQuestionResponse(
        id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
        question: $checkedConvert('question', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$QuestionpackagePackageQuestionResponseToJson(
  QuestionpackagePackageQuestionResponse instance,
) => <String, dynamic>{'id': ?instance.id, 'question': ?instance.question};
