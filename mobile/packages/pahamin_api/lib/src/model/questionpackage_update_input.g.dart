// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_update_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageUpdateInput _$QuestionpackageUpdateInputFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'QuestionpackageUpdateInput',
  json,
  ($checkedConvert) {
    final val = QuestionpackageUpdateInput(
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

Map<String, dynamic> _$QuestionpackageUpdateInputToJson(
  QuestionpackageUpdateInput instance,
) => <String, dynamic>{
  'collection_id': ?instance.collectionId,
  'description': ?instance.description,
  'name': ?instance.name,
  'status': ?instance.status,
  'subject_id': ?instance.subjectId,
};
