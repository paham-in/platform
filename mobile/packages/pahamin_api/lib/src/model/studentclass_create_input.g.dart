// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studentclass_create_input.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StudentclassCreateInput _$StudentclassCreateInputFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('StudentclassCreateInput', json, ($checkedConvert) {
  final val = StudentclassCreateInput(
    classId: $checkedConvert('class_id', (v) => (v as num?)?.toInt()),
    expiry: $checkedConvert('expiry', (v) => v as String?),
    userId: $checkedConvert('user_id', (v) => (v as num?)?.toInt()),
  );
  return val;
}, fieldKeyMap: const {'classId': 'class_id', 'userId': 'user_id'});

Map<String, dynamic> _$StudentclassCreateInputToJson(
  StudentclassCreateInput instance,
) => <String, dynamic>{
  'class_id': ?instance.classId,
  'expiry': ?instance.expiry,
  'user_id': ?instance.userId,
};
