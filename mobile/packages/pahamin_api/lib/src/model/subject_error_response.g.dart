// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subject_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SubjectErrorResponse _$SubjectErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('SubjectErrorResponse', json, ($checkedConvert) {
  final val = SubjectErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$SubjectErrorResponseToJson(
  SubjectErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
