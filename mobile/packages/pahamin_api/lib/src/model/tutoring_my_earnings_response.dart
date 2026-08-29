//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/tutoring_list_sessions_response.dart';
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_my_earnings_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringMyEarningsResponse {
  /// Returns a new [TutoringMyEarningsResponse] instance.
  TutoringMyEarningsResponse({

     this.feeAvailableTotal,

     this.feePaidTotal,

     this.feeTakenTotal,

     this.feeUnpaidTotal,

     this.sessions,

     this.totalFee,

     this.totalSessions,
  });

  @JsonKey(
    
    name: r'fee_available_total',
    required: false,
    includeIfNull: false,
  )


  final num? feeAvailableTotal;



  @JsonKey(
    
    name: r'fee_paid_total',
    required: false,
    includeIfNull: false,
  )


  final num? feePaidTotal;



  @JsonKey(
    
    name: r'fee_taken_total',
    required: false,
    includeIfNull: false,
  )


  final num? feeTakenTotal;



  @JsonKey(
    
    name: r'fee_unpaid_total',
    required: false,
    includeIfNull: false,
  )


  final num? feeUnpaidTotal;



  @JsonKey(
    
    name: r'sessions',
    required: false,
    includeIfNull: false,
  )


  final List<TutoringListSessionsResponse>? sessions;



  @JsonKey(
    
    name: r'total_fee',
    required: false,
    includeIfNull: false,
  )


  final num? totalFee;



  @JsonKey(
    
    name: r'total_sessions',
    required: false,
    includeIfNull: false,
  )


  final int? totalSessions;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringMyEarningsResponse &&
      other.feeAvailableTotal == feeAvailableTotal &&
      other.feePaidTotal == feePaidTotal &&
      other.feeTakenTotal == feeTakenTotal &&
      other.feeUnpaidTotal == feeUnpaidTotal &&
      other.sessions == sessions &&
      other.totalFee == totalFee &&
      other.totalSessions == totalSessions;

    @override
    int get hashCode =>
        feeAvailableTotal.hashCode +
        feePaidTotal.hashCode +
        feeTakenTotal.hashCode +
        feeUnpaidTotal.hashCode +
        sessions.hashCode +
        totalFee.hashCode +
        totalSessions.hashCode;

  factory TutoringMyEarningsResponse.fromJson(Map<String, dynamic> json) => _$TutoringMyEarningsResponseFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringMyEarningsResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

