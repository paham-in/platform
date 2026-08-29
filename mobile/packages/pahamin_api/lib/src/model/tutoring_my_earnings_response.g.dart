// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tutoring_my_earnings_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TutoringMyEarningsResponse _$TutoringMyEarningsResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'TutoringMyEarningsResponse',
  json,
  ($checkedConvert) {
    final val = TutoringMyEarningsResponse(
      feeAvailableTotal: $checkedConvert(
        'fee_available_total',
        (v) => v as num?,
      ),
      feePaidTotal: $checkedConvert('fee_paid_total', (v) => v as num?),
      feeTakenTotal: $checkedConvert('fee_taken_total', (v) => v as num?),
      feeUnpaidTotal: $checkedConvert('fee_unpaid_total', (v) => v as num?),
      sessions: $checkedConvert(
        'sessions',
        (v) => (v as List<dynamic>?)
            ?.map(
              (e) => TutoringListSessionsResponse.fromJson(
                e as Map<String, dynamic>,
              ),
            )
            .toList(),
      ),
      totalFee: $checkedConvert('total_fee', (v) => v as num?),
      totalSessions: $checkedConvert(
        'total_sessions',
        (v) => (v as num?)?.toInt(),
      ),
    );
    return val;
  },
  fieldKeyMap: const {
    'feeAvailableTotal': 'fee_available_total',
    'feePaidTotal': 'fee_paid_total',
    'feeTakenTotal': 'fee_taken_total',
    'feeUnpaidTotal': 'fee_unpaid_total',
    'totalFee': 'total_fee',
    'totalSessions': 'total_sessions',
  },
);

Map<String, dynamic> _$TutoringMyEarningsResponseToJson(
  TutoringMyEarningsResponse instance,
) => <String, dynamic>{
  'fee_available_total': ?instance.feeAvailableTotal,
  'fee_paid_total': ?instance.feePaidTotal,
  'fee_taken_total': ?instance.feeTakenTotal,
  'fee_unpaid_total': ?instance.feeUnpaidTotal,
  'sessions': ?instance.sessions?.map((e) => e.toJson()).toList(),
  'total_fee': ?instance.totalFee,
  'total_sessions': ?instance.totalSessions,
};
