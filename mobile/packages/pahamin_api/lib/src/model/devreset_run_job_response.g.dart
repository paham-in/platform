// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'devreset_run_job_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DevresetRunJobResponse _$DevresetRunJobResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('DevresetRunJobResponse', json, ($checkedConvert) {
  final val = DevresetRunJobResponse(
    deleted: $checkedConvert('deleted', (v) => (v as num?)?.toInt()),
    job: $checkedConvert('job', (v) => v as String?),
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$DevresetRunJobResponseToJson(
  DevresetRunJobResponse instance,
) => <String, dynamic>{
  'deleted': ?instance.deleted,
  'job': ?instance.job,
  'message': ?instance.message,
};
