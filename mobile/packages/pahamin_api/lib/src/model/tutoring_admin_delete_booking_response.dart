//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_admin_delete_booking_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringAdminDeleteBookingResponse {
  /// Returns a new [TutoringAdminDeleteBookingResponse] instance.
  TutoringAdminDeleteBookingResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringAdminDeleteBookingResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory TutoringAdminDeleteBookingResponse.fromJson(Map<String, dynamic> json) => _$TutoringAdminDeleteBookingResponseFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringAdminDeleteBookingResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

