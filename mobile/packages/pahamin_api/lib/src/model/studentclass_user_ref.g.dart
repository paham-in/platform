// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studentclass_user_ref.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StudentclassUserRef _$StudentclassUserRefFromJson(Map<String, dynamic> json) =>
    $checkedCreate('StudentclassUserRef', json, ($checkedConvert) {
      final val = StudentclassUserRef(
        id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
        name: $checkedConvert('name', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$StudentclassUserRefToJson(
  StudentclassUserRef instance,
) => <String, dynamic>{'id': ?instance.id, 'name': ?instance.name};
