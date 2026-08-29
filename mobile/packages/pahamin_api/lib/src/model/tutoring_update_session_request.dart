//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_update_session_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringUpdateSessionRequest {
  /// Returns a new [TutoringUpdateSessionRequest] instance.
  TutoringUpdateSessionRequest({

     this.date,

     this.endTime,

     this.startTime,
  });

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
    
    name: r'start_time',
    required: false,
    includeIfNull: false,
  )


  final String? startTime;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringUpdateSessionRequest &&
      other.date == date &&
      other.endTime == endTime &&
      other.startTime == startTime;

    @override
    int get hashCode =>
        date.hashCode +
        endTime.hashCode +
        startTime.hashCode;

  factory TutoringUpdateSessionRequest.fromJson(Map<String, dynamic> json) => _$TutoringUpdateSessionRequestFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringUpdateSessionRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

