//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_admin_list_report_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringAdminListReportResponse {
  /// Returns a new [TutoringAdminListReportResponse] instance.
  TutoringAdminListReportResponse({

     this.bookingId,

     this.cancelledCount,

     this.doneCount,

     this.feePerSession,

     this.feeUnpaidTotal,

     this.invoiceStatus,

     this.mode,

     this.pricePerSession,

     this.refundAmount,

     this.scheduledCount,

     this.sessionCount,

     this.studentId,

     this.studentName,

     this.teacherName,
  });

  @JsonKey(
    
    name: r'booking_id',
    required: false,
    includeIfNull: false,
  )


  final int? bookingId;



  @JsonKey(
    
    name: r'cancelled_count',
    required: false,
    includeIfNull: false,
  )


  final int? cancelledCount;



  @JsonKey(
    
    name: r'done_count',
    required: false,
    includeIfNull: false,
  )


  final int? doneCount;



  @JsonKey(
    
    name: r'fee_per_session',
    required: false,
    includeIfNull: false,
  )


  final num? feePerSession;



  @JsonKey(
    
    name: r'fee_unpaid_total',
    required: false,
    includeIfNull: false,
  )


  final num? feeUnpaidTotal;



  @JsonKey(
    
    name: r'invoice_status',
    required: false,
    includeIfNull: false,
  )


  final String? invoiceStatus;



  @JsonKey(
    
    name: r'mode',
    required: false,
    includeIfNull: false,
  )


  final String? mode;



  @JsonKey(
    
    name: r'price_per_session',
    required: false,
    includeIfNull: false,
  )


  final num? pricePerSession;



  @JsonKey(
    
    name: r'refund_amount',
    required: false,
    includeIfNull: false,
  )


  final num? refundAmount;



  @JsonKey(
    
    name: r'scheduled_count',
    required: false,
    includeIfNull: false,
  )


  final int? scheduledCount;



  @JsonKey(
    
    name: r'session_count',
    required: false,
    includeIfNull: false,
  )


  final int? sessionCount;



  @JsonKey(
    
    name: r'student_id',
    required: false,
    includeIfNull: false,
  )


  final int? studentId;



  @JsonKey(
    
    name: r'student_name',
    required: false,
    includeIfNull: false,
  )


  final String? studentName;



  @JsonKey(
    
    name: r'teacher_name',
    required: false,
    includeIfNull: false,
  )


  final String? teacherName;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringAdminListReportResponse &&
      other.bookingId == bookingId &&
      other.cancelledCount == cancelledCount &&
      other.doneCount == doneCount &&
      other.feePerSession == feePerSession &&
      other.feeUnpaidTotal == feeUnpaidTotal &&
      other.invoiceStatus == invoiceStatus &&
      other.mode == mode &&
      other.pricePerSession == pricePerSession &&
      other.refundAmount == refundAmount &&
      other.scheduledCount == scheduledCount &&
      other.sessionCount == sessionCount &&
      other.studentId == studentId &&
      other.studentName == studentName &&
      other.teacherName == teacherName;

    @override
    int get hashCode =>
        bookingId.hashCode +
        cancelledCount.hashCode +
        doneCount.hashCode +
        feePerSession.hashCode +
        feeUnpaidTotal.hashCode +
        invoiceStatus.hashCode +
        mode.hashCode +
        pricePerSession.hashCode +
        refundAmount.hashCode +
        scheduledCount.hashCode +
        sessionCount.hashCode +
        studentId.hashCode +
        studentName.hashCode +
        teacherName.hashCode;

  factory TutoringAdminListReportResponse.fromJson(Map<String, dynamic> json) => _$TutoringAdminListReportResponseFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringAdminListReportResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

