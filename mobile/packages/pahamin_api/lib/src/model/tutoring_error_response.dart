//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringErrorResponse {
  /// Returns a new [TutoringErrorResponse] instance.
  TutoringErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory TutoringErrorResponse.fromJson(Map<String, dynamic> json) => _$TutoringErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

