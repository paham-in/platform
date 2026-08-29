// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_mark_earnings_taken_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringMarkEarningsTakenRequest _$TutoringMarkEarningsTakenRequestFromJson(
  Map<String, dynamic> json,
) =>
    $checkedCreate('TutoringMarkEarningsTakenRequest', json, ($checkedConvert) {
      final val = TutoringMarkEarningsTakenRequest(
        sessionIds: $checkedConvert(
          'session_ids',
          (v) => (v as List<dynamic>?)?.map((e) => (e as num).toInt()).toList(),
        ),
        taken: $checkedConvert('taken', (v) => v as bool?),
      );
      return val;
    }, fieldKeyMap: const {'sessionIds': 'session_ids'});

Map<String, dynamic> _$TutoringMarkEarningsTakenRequestToJson(
  TutoringMarkEarningsTakenRequest instance,
) => <String, dynamic>{
  'session_ids': ?instance.sessionIds,
  'taken': ?instance.taken,
};
