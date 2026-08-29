// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_create_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageCreateInput _$QuestionpackageCreateInputFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'QuestionpackageCreateInput',
  json,
  ($checkedConvert) {
    final val = QuestionpackageCreateInput(
      collectionId: $checkedConvert(
        'collection_id',
        (v) => (v as num?)?.toInt(),
      ),
      description: $checkedConvert('description', (v) => v as String?),
      name: $checkedConvert('name', (v) => v as String?),
      status: $checkedConvert('status', (v) => v as String?),
      subjectId: $checkedConvert('subject_id', (v) => (v as num?)?.toInt()),
    );
    return val;
  },
  fieldKeyMap: const {
    'collectionId': 'collection_id',
    'subjectId': 'subject_id',
  },
);

Map<String, dynamic> _$QuestionpackageCreateInputToJson(
  QuestionpackageCreateInput instance,
) => <String, dynamic>{
  'collection_id': ?instance.collectionId,
  'description': ?instance.description,
  'name': ?instance.name,
  'status': ?instance.status,
  'subject_id': ?instance.subjectId,
};
