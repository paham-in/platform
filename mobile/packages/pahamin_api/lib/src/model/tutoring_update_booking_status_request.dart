//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_update_booking_status_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringUpdateBookingStatusRequest {
  /// Returns a new [TutoringUpdateBookingStatusRequest] instance.
  TutoringUpdateBookingStatusRequest({

     this.status,
  });

  @JsonKey(
    
    name: r'status',
    required: false,
    includeIfNull: false,
  )


  final String? status;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringUpdateBookingStatusRequest &&
      other.status == status;

    @override
    int get hashCode =>
        status.hashCode;

  factory TutoringUpdateBookingStatusRequest.fromJson(Map<String, dynamic> json) => _$TutoringUpdateBookingStatusRequestFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringUpdateBookingStatusRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

