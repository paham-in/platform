//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_cancel_session_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringCancelSessionResponse {
  /// Returns a new [TutoringCancelSessionResponse] instance.
  TutoringCancelSessionResponse({

     this.bookingId,

     this.date,

     this.endTime,

     this.evidenceUrl,

     this.feeAmount,

     this.feePaid,

     this.feeTaken,

     this.id,

     this.invoicePaid,

     this.mode,

     this.note,

     this.startTime,

     this.status,

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
    
    name: r'date',
    required: false,
    includeIfNull: false,
  )


  final String? date;



  @JsonKey(
    
    name: r'end_time',
    required: false,
    includeIfNull: false,
  )


  final String? endTime;



  @JsonKey(
    
    name: r'evidence_url',
    required: false,
    includeIfNull: false,
  )


  final String? evidenceUrl;



  @JsonKey(
    
    name: r'fee_amount',
    required: false,
    includeIfNull: false,
  )


  final num? feeAmount;



  @JsonKey(
    
    name: r'fee_paid',
    required: false,
    includeIfNull: false,
  )


  final bool? feePaid;



  @JsonKey(
    
    name: r'fee_taken',
    required: false,
    includeIfNull: false,
  )


  final bool? feeTaken;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'invoice_paid',
    required: false,
    includeIfNull: false,
  )


  final bool? invoicePaid;



  @JsonKey(
    
    name: r'mode',
    required: false,
    includeIfNull: false,
  )


  final String? mode;



  @JsonKey(
    
    name: r'note',
    required: false,
    includeIfNull: false,
  )


  final String? note;



  @JsonKey(
    
    name: r'start_time',
    required: false,
    includeIfNull: false,
  )


  final String? startTime;



  @JsonKey(
    
    name: r'status',
    required: false,
    includeIfNull: false,
  )


  final String? status;



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
    bool operator ==(Object other) => identical(this, other) || other is TutoringCancelSessionResponse &&
      other.bookingId == bookingId &&
      other.date == date &&
      other.endTime == endTime &&
      other.evidenceUrl == evidenceUrl &&
      other.feeAmount == feeAmount &&
      other.feePaid == feePaid &&
      other.feeTaken == feeTaken &&
      other.id == id &&
      other.invoicePaid == invoicePaid &&
      other.mode == mode &&
      other.note == note &&
      other.startTime == startTime &&
      other.status == status &&
      other.studentId == studentId &&
      other.studentName == studentName &&
      other.teacherName == teacherName;

    @override
    int get hashCode =>
        bookingId.hashCode +
        date.hashCode +
        endTime.hashCode +
        evidenceUrl.hashCode +
        feeAmount.hashCode +
        feePaid.hashCode +
        feeTaken.hashCode +
        id.hashCode +
        invoicePaid.hashCode +
        mode.hashCode +
        note.hashCode +
        startTime.hashCode +
        status.hashCode +
        studentId.hashCode +
        studentName.hashCode +
        teacherName.hashCode;

  factory TutoringCancelSessionResponse.fromJson(Map<String, dynamic> json) => _$TutoringCancelSessionResponseFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringCancelSessionResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

