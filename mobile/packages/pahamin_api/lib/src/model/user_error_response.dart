//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserErrorResponse {
  /// Returns a new [UserErrorResponse] instance.
  UserErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory UserErrorResponse.fromJson(Map<String, dynamic> json) => _$UserErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UserErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

